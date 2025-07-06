-- Create indexes for users table
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_account_status_idx ON users(account_status);
CREATE INDEX IF NOT EXISTS users_email_status_idx ON users(email_status);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at);
CREATE INDEX IF NOT EXISTS users_locked_until_idx ON users(locked_until);

-- Create indexes for accounts table
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON account(user_id);

-- Create indexes for login_activities table
CREATE INDEX IF NOT EXISTS login_activities_user_id_idx ON login_activities(user_id);
CREATE INDEX IF NOT EXISTS login_activities_created_at_idx ON login_activities(created_at);
CREATE INDEX IF NOT EXISTS login_activities_success_idx ON login_activities(success);
CREATE INDEX IF NOT EXISTS login_activities_ip_address_idx ON login_activities(ip_address);

-- Create indexes for verification_tokens table
CREATE INDEX IF NOT EXISTS verification_tokens_email_idx ON verification_token(email);
CREATE INDEX IF NOT EXISTS verification_tokens_expires_idx ON verification_token(expires);

-- Create indexes for password_reset_tokens table
CREATE INDEX IF NOT EXISTS password_reset_tokens_email_idx ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_idx ON password_reset_tokens(expires);

-- Create indexes for two_factor_tokens table
CREATE INDEX IF NOT EXISTS two_factor_tokens_email_idx ON two_factor_tokens(email);
CREATE INDEX IF NOT EXISTS two_factor_tokens_expires_idx ON two_factor_tokens(expires);

-- Create indexes for two_factor_confirmations table
CREATE INDEX IF NOT EXISTS two_factor_confirmations_user_id_idx ON two_factor_confirmations(user_id);

-- Add partial indexes for better performance on specific queries
CREATE INDEX IF NOT EXISTS users_active_email_confirmed_idx ON users(id) 
WHERE account_status = 'active' AND email_status = 'confirmed';

CREATE INDEX IF NOT EXISTS users_locked_accounts_idx ON users(id, locked_until) 
WHERE locked_until IS NOT NULL;

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS login_activities_user_success_time_idx ON login_activities(user_id, success, created_at DESC);