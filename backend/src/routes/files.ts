import path from "node:path";
import { randomUUID } from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { respondS3NotConfigured } from "../lib/s3-setup.js";
import { requireAuth } from "../middleware/auth.js";
import {
  deleteObjectKey,
  getDownloadSignedUrl,
  getS3Bucket,
  isS3Configured,
  publicObjectUrl,
  putObject,
} from "../services/s3.js";

const filesRouter = Router();

const MAX_BYTES = 10 * 1024 * 1024;
const PRESIGN_TTL_SECONDS = 3600;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
});

function assertS3OrRespond(res: Parameters<typeof respondS3NotConfigured>[0]): boolean {
  if (!isS3Configured()) {
    respondS3NotConfigured(res);
    return false;
  }
  return true;
}

function safeBasename(original: string): string {
  const base = path.basename(original).replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.length > 0 ? base.slice(0, 180) : "file";
}

filesRouter.post(
  "/upload",
  requireAuth,
  (req, res, next) => {
    if (!assertS3OrRespond(res)) {
      return;
    }
    next();
  },
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(413).json({ error: `File too large (max ${MAX_BYTES} bytes)` });
          return;
        }
        res.status(400).json({ error: err.message });
        return;
      }
      if (err) {
        next(err);
        return;
      }
      next();
    });
  },
  async (req, res) => {
    const userId = req.userId!;
    const file = req.file;
    if (!file?.buffer) {
      res.status(400).json({ error: 'Expected multipart field "file"' });
      return;
    }

    const region = process.env.AWS_REGION!.trim();
    const bucket = getS3Bucket();
    const objectKey = `uploads/${userId}/${randomUUID()}-${safeBasename(file.originalname)}`;
    const contentType = file.mimetype || "application/octet-stream";

    try {
      await putObject({
        key: objectKey,
        body: file.buffer,
        contentType,
      });
    } catch (e) {
      console.error("S3 PutObject failed", e);
      res.status(502).json({ error: "Failed to upload file to storage" });
      return;
    }

    const url = publicObjectUrl(bucket, region, objectKey);

    let row;
    try {
      row = await prisma.file.create({
        data: {
          userId,
          key: objectKey,
          url,
          name: file.originalname,
          size: file.size,
        },
        select: {
          id: true,
          url: true,
          key: true,
          name: true,
          size: true,
          createdAt: true,
        },
      });
    } catch (e) {
      console.error("File metadata save failed", e);
      try {
        await deleteObjectKey(objectKey);
      } catch {
        /* best effort cleanup */
      }
      res.status(500).json({ error: "Failed to save file metadata" });
      return;
    }

    let signedUrl: string;
    try {
      signedUrl = await getDownloadSignedUrl(objectKey, PRESIGN_TTL_SECONDS);
    } catch (e) {
      console.error("Presign failed", e);
      res.status(201).json({
        file: row,
        message: "Uploaded; could not create a temporary download URL.",
      });
      return;
    }

    res.status(201).json({
      file: row,
      downloadUrl: signedUrl,
      downloadUrlExpiresInSeconds: PRESIGN_TTL_SECONDS,
    });
  },
);

filesRouter.get(
  "/",
  requireAuth,
  (req, res, next) => {
    if (!assertS3OrRespond(res)) {
      return;
    }
    next();
  },
  async (req, res) => {
    const userId = req.userId!;
    const rows = await prisma.file.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        url: true,
        key: true,
        name: true,
        size: true,
        createdAt: true,
      },
    });

    const files = await Promise.all(
      rows.map(async (r) => {
        const downloadUrl = await getDownloadSignedUrl(r.key, PRESIGN_TTL_SECONDS);
        return {
          ...r,
          downloadUrl,
          downloadUrlExpiresInSeconds: PRESIGN_TTL_SECONDS,
        };
      }),
    );

    res.json({ files });
  },
);

filesRouter.delete(
  "/:id",
  requireAuth,
  (req, res, next) => {
    if (!assertS3OrRespond(res)) {
      return;
    }
    next();
  },
  async (req, res) => {
    const userId = req.userId!;
    const id = req.params.id?.trim();
    if (!id) {
      res.status(400).json({ error: "Missing id" });
      return;
    }

    const row = await prisma.file.findFirst({
      where: { id, userId },
    });
    if (!row) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    try {
      await deleteObjectKey(row.key);
    } catch (e) {
      console.error("S3 DeleteObject failed", e);
      res.status(502).json({ error: "Failed to delete file from storage" });
      return;
    }

    await prisma.file.delete({ where: { id: row.id } });
    res.status(204).send();
  },
);

export { filesRouter };
