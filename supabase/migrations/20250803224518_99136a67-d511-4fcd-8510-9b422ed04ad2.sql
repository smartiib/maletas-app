-- Confirmar email do usuário admin automaticamente
UPDATE auth.users 
SET email_confirmed_at = now(), 
    confirmation_sent_at = now()
WHERE email = 'douglas@agencia2b.com.br' AND email_confirmed_at IS NULL;