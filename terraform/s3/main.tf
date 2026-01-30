resource "aws_s3_bucket" "mna_meeting_notes" {
  bucket = "mna-meeting-notes"

  tags = {
    Name        = "mna-meeting-notes"
    Environment = "dev"
    Project     = "MnA"
    ManagedBy   = "Terraform"
  }
}

resource "aws_s3_bucket_versioning" "mna_meeting_notes_versioning" {
  bucket = aws_s3_bucket.mna_meeting_notes.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "mna_meeting_notes_encryption" {
  bucket = aws_s3_bucket.mna_meeting_notes.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "mna_meeting_notes_public_access" {
  bucket = aws_s3_bucket.mna_meeting_notes.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "mna_meeting_notes_cors" {
  bucket = aws_s3_bucket.mna_meeting_notes.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = [
      "http://localhost:3000",
      "https://mna-tracker.vercel.app"
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
