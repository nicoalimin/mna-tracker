data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "random_password" "password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_security_group" "rds_sg" {
  name        = "mna-tracker-rds-sg"
  description = "Allow inbound traffic for PostgreSQL"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # WARNING: Open to the world. Restrict in production.
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "mna-tracker-rds-sg"
  }
}

resource "aws_db_instance" "default" {
  identifier             = "mna-tracker-db"
  allocated_storage      = var.allocated_storage
  storage_type           = "gp2"
  engine                 = "postgres"
  engine_version         = "16" # Check for latest supported version
  instance_class         = var.instance_class
  db_name                = var.db_name
  username               = var.db_username
  password               = random_password.password.result
  parameter_group_name   = "default.postgres16"
  skip_final_snapshot    = true
  publicly_accessible    = true # Set to false if not needed publicly
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  tags = {
    Name = "mna-tracker-db"
  }
}
