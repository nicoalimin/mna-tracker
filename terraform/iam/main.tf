# Variables
variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket to grant access to"
  type        = string
  default     = "arn:aws:s3:::mna-meeting-notes"
}

# IAM Policy for S3 Read/Write Access
resource "aws_iam_policy" "mna_meeting_notes_s3_policy" {
  name        = "mna-meeting-notes-s3-policy"
  description = "Policy to read and write to the mna-meeting-notes S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ListBucket"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = var.s3_bucket_arn
      },
      {
        Sid    = "ReadWriteObjects"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObjectVersion",
          "s3:GetObjectAcl",
          "s3:PutObjectAcl"
        ]
        Resource = "${var.s3_bucket_arn}/*"
      }
    ]
  })

  tags = {
    Environment = "dev"
    Project     = "MnA"
    ManagedBy   = "Terraform"
  }
}

# IAM Role for S3 Access (can be assumed by EC2, Lambda, etc.)
resource "aws_iam_role" "mna_meeting_notes_role" {
  name        = "mna-meeting-notes-role"
  description = "Role for accessing mna-meeting-notes S3 bucket"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = [
            "ec2.amazonaws.com",
            "lambda.amazonaws.com"
          ]
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Environment = "dev"
    Project     = "MnA"
    ManagedBy   = "Terraform"
  }
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "mna_meeting_notes_role_attachment" {
  role       = aws_iam_role.mna_meeting_notes_role.name
  policy_arn = aws_iam_policy.mna_meeting_notes_s3_policy.arn
}

# IAM User for programmatic access
resource "aws_iam_user" "mna_meeting_notes_user" {
  name = "mna-meeting-notes-user"
  path = "/mna/"

  tags = {
    Environment = "dev"
    Project     = "MnA"
    ManagedBy   = "Terraform"
  }
}

# Attach policy to user
resource "aws_iam_user_policy_attachment" "mna_meeting_notes_user_attachment" {
  user       = aws_iam_user.mna_meeting_notes_user.name
  policy_arn = aws_iam_policy.mna_meeting_notes_s3_policy.arn
}
