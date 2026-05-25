-- ─────────────────────────────────────────────────────────────────────
-- Claramente — migration para perfil inclusivo (onboarding + perfil)
-- ─────────────────────────────────────────────────────────────────────
-- Rode esse SQL UMA VEZ no SQL Editor do Supabase (ou via CLI).
--
-- Adiciona as colunas usadas pela tela de Onboarding e pelo Perfil:
--   • pronouns           — pronome (ele/dele, ela/dela, elu/delu, ...)
--   • gender             — gênero (mulher_cis, homem_cis, mulher_trans, ...)
--   • sexual_orientation — orientação (hetero, homo, bi, pan, ...)
--   • birth_date         — data de nascimento
--   • phone              — telefone (só dígitos, sem formatação)
--   • onboarding_completed — flag de quem já passou pela tela
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pronouns           TEXT,
  ADD COLUMN IF NOT EXISTS gender             TEXT,
  ADD COLUMN IF NOT EXISTS sexual_orientation TEXT,
  ADD COLUMN IF NOT EXISTS birth_date         DATE,
  ADD COLUMN IF NOT EXISTS phone              TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Marca usuários ANTIGOS como já passados pelo onboarding,
-- pra eles não serem redirecionados involuntariamente.
-- Comente essa linha se quiser forçar TODOS a refazer o onboarding.
UPDATE public.profiles
  SET onboarding_completed = TRUE
  WHERE onboarding_completed IS NULL OR onboarding_completed = FALSE;

-- Índice opcional pra acelerar o check no login.
CREATE INDEX IF NOT EXISTS profiles_onboarding_idx
  ON public.profiles(onboarding_completed);

-- Pronto. O Supabase tem RLS então confira se a sua policy de UPDATE
-- na tabela profiles permite o próprio usuário atualizar suas linhas:
--
--   CREATE POLICY "users update own profile" ON public.profiles
--     FOR UPDATE USING (auth.uid() = id);
--
-- Se já existe uma policy similar, ignore.
