# Role outputs
output "role_arn" {
  description = "ARN of the IAM role"
  value       = aws_iam_role.mna_meeting_notes_role.arn
}

output "role_name" {
  description = "Name of the IAM role"
  value       = aws_iam_role.mna_meeting_notes_role.name
}

# User outputs
output "user_arn" {
  description = "ARN of the IAM user"
  value       = aws_iam_user.mna_meeting_notes_user.arn
}

output "user_name" {
  description = "Name of the IAM user"
  value       = aws_iam_user.mna_meeting_notes_user.name
}

# Policy output
output "policy_arn" {
  description = "ARN of the S3 access policy"
  value       = aws_iam_policy.mna_meeting_notes_s3_policy.arn
}
