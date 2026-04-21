import type { Response } from "express";

/**
 * Shown when file routes are called without AWS S3 env configured.
 */
export const S3_SETUP_STEPS: readonly string[] = [
  "Create an AWS account (free tier is enough to try S3).",
  "In AWS Console → S3, create a bucket in your preferred region.",
  "Create an IAM user (or role for production) with programmatic access and a policy that allows s3:PutObject, s3:GetObject, and s3:DeleteObject on that bucket (and ListBucket if you use console checks).",
  "Copy the access key ID and secret into AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in backend/.env.",
  "Set AWS_REGION to the bucket region (e.g. eu-central-1) and AWS_S3_BUCKET to the bucket name.",
  "Restart the API. Upload/list/delete will work; until then these endpoints return HTTP 503 with this guide in JSON.",
];

export function respondS3NotConfigured(res: Response): void {
  res.status(503).json({
    error: "File storage is not enabled",
    code: "S3_NOT_CONFIGURED",
    message:
      "Uploads require Amazon S3. Auth, billing (optional), and other features work without it. When you want file storage, follow setupSteps and fill the AWS variables in backend/.env.",
    setupSteps: [...S3_SETUP_STEPS],
  });
}
