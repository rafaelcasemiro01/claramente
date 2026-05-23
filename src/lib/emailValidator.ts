const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
  'yopmail.com', 'sharklasers.com', 'grr.la', 'guerrillamail.info',
  'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.net', 'guerrillamail.org',
  'spam4.me', 'trashmail.com', 'trashmail.me', 'trashmail.net', 'fakeinbox.com',
  'getairmail.com', 'dispostable.com', 'mintemail.com', 'mailnull.com',
  'spamgourmet.com', '10minutemail.com', '10minutemail.net', 'tempr.email',
  'discard.email', 'tempinbox.com', 'mailnesia.com', 'maildrop.cc', 'mailnull.com',
  'spamcorptastic.com', 'spamgob.com', 'spamhereplease.com', 'spamspot.com',
  'spamthis.co.uk', 'spaml.de', 'spaml.com', 'safetymail.info', 'rtrtr.com',
  'rcpt.at', 'rbike.net', 'quickinbox.com', 'nomail.xl.cx', 'neverbox.com',
  'mt2015.com', 'mt2014.com', 'mogwai.be', 'mailzilla.com', 'mailzilla.org',
  'mailscrap.com', 'mailseal.de', 'mailrock.biz', 'mailnew.com', 'mailme24.com',
  'mailme.ir', 'mailme.lv', 'mailhazard.com', 'mailha.com', 'mailguard.me',
  'mailfree.ga', 'mailforspam.com', 'mailf5.com', 'mailexpire.com', 'maildu.de',
  'mailbidon.com', 'mailblade.net', 'mail333.com', 'mail2rss.org',
  'litedrop.com', 'junk1.it', 'jetable.fr.nf', 'jetable.net', 'jetable.org',
  'incognitomail.org', 'hulapla.de', 'hushmail.com', 'gowikibooks.com',
  'filzmail.com', 'fakeinformation.com', 'e4ward.com', 'dudmail.com',
  'drdrb.com', 'dontreg.com', 'dodgit.com', 'despam.it', 'despammed.com',
  'crazymailing.com', 'courriel.fr.nf', 'cool.fr.nf', 'contactoprivado.com',
  'cool.fr.nf', 'clrmail.com', 'chammy.info', 'bredband.net', 'brefmail.com',
  'bsnow.net', 'bugmenot.com', 'bumpymail.com', 'byom.de',
])

const KNOWN_PROVIDERS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.com.br', 'hotmail.com',
  'hotmail.com.br', 'outlook.com', 'outlook.com.br', 'live.com', 'live.com.br',
  'msn.com', 'icloud.com', 'me.com', 'mac.com', 'protonmail.com', 'proton.me',
  'uol.com.br', 'bol.com.br', 'terra.com.br', 'ig.com.br', 'r7.com',
  'globomail.com', 'oi.com.br', 'zipmail.com.br', 'aol.com', 'zoho.com',
  'fastmail.com', 'mail.com', 'gmx.com', 'gmx.net', 'yandex.com', 'yandex.ru',
  'tutanota.com', 'tutamail.com', 'pm.me',
])

export interface EmailValidation {
  valid: boolean
  message: string
  type: 'idle' | 'valid' | 'error' | 'warning'
}

export function validateEmail(email: string): EmailValidation {
  if (!email) return { valid: false, message: '', type: 'idle' }

  const trimmed = email.trim().toLowerCase()

  // 1. Formato básico
  if (!trimmed.includes('@'))
    return { valid: false, message: 'E-mail deve conter @', type: 'error' }

  const [local, domain] = trimmed.split('@')

  if (!local || local.length < 2)
    return { valid: false, message: 'Parte antes do @ muito curta', type: 'error' }

  if (!domain)
    return { valid: false, message: 'Informe o domínio (ex: gmail.com)', type: 'error' }

  // 2. Regex completo de e-mail
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/
  if (!regex.test(trimmed))
    return { valid: false, message: 'Formato de e-mail inválido', type: 'error' }

  // 3. Domínio descartável / temporário
  if (DISPOSABLE_DOMAINS.has(domain))
    return { valid: false, message: 'E-mails temporários não são aceitos', type: 'error' }

  // 4. Extensão válida
  const parts = domain.split('.')
  const tld = parts[parts.length - 1]
  if (tld.length < 2 || tld.length > 6)
    return { valid: false, message: 'Extensão de e-mail inválida (.com, .br...)', type: 'error' }

  // 5. Domínio suspeito — sem vogais ou muito curto
  const domainName = parts[0]
  const hasVowel = /[aeiou]/i.test(domainName)
  if (!hasVowel && domainName.length > 3)
    return { valid: false, message: 'Domínio de e-mail parece inválido', type: 'error' }

  // 6. Padrão aleatório — muitos números seguidos ou chars repetidos
  if (/(\w)\1{4,}/.test(local))
    return { valid: false, message: 'E-mail parece inválido', type: 'error' }

  if (/\d{6,}/.test(local) && local.length < 8)
    return { valid: false, message: 'E-mail parece gerado automaticamente', type: 'error' }

  // 7. Provedor conhecido → confirma verde
  if (KNOWN_PROVIDERS.has(domain))
    return { valid: true, message: 'E-mail válido ✓', type: 'valid' }

  // 8. Domínio corporativo/institucional → aviso leve
  if (domain.endsWith('.edu.br') || domain.endsWith('.gov.br') || domain.endsWith('.org.br'))
    return { valid: true, message: 'E-mail institucional ✓', type: 'valid' }

  // 9. Domínio desconhecido mas válido
  return { valid: true, message: 'E-mail válido ✓', type: 'valid' }
}