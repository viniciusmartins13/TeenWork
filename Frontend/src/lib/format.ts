import type { ApplicationStatus, ExperienceType, JobStatus, JobType, WorkModel } from './types';

export const workModelLabels: Record<WorkModel, string> = {
  OnSite: 'Presencial',
  Hybrid: 'Híbrido',
  Remote: 'Remoto',
};

export const jobTypeLabels: Record<JobType, string> = {
  Internship: 'Estágio',
  YoungApprentice: 'Jovem Aprendiz',
  FirstJob: 'Primeiro emprego',
  PartTime: 'Meio período',
  Course: 'Curso',
};

export const jobStatusLabels: Record<JobStatus, string> = {
  Active: 'Ativa',
  Inactive: 'Pausada',
  Closed: 'Encerrada',
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  Pending: 'Pendente',
  UnderReview: 'Em análise',
  Accepted: 'Aprovada',
  Rejected: 'Recusada',
  Cancelled: 'Cancelada',
};

export const experienceTypeLabels: Record<ExperienceType, string> = {
  Job: 'Trabalho',
  Internship: 'Estágio',
  Volunteer: 'Voluntariado',
  Project: 'Projeto',
  Course: 'Curso',
};

export const sortOptions = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'oldest', label: 'Mais antigas' },
  { value: 'salary_desc', label: 'Maior salário' },
  { value: 'salary_asc', label: 'Menor salário' },
  { value: 'deadline', label: 'Prazo mais próximo' },
];

export const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR',
  'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export const commonAreas = [
  'Administração', 'Atendimento', 'Comunicação', 'Design', 'Educação', 'Engenharia', 'Finanças',
  'Logística', 'Marketing', 'Recursos Humanos', 'Saúde', 'Tecnologia', 'Varejo', 'Vendas',
];

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export function formatCurrency(value: number) {
  return currency.format(value);
}

export function formatSalary(salary: number | null | undefined, jobType?: JobType) {
  if (salary === null || salary === undefined) return jobType === 'Course' ? 'Gratuito' : 'A combinar';
  if (salary === 0) return jobType === 'Course' ? 'Gratuito' : 'Não remunerada';
  return `${formatCurrency(salary)}/mês`;
}

/** Datas "yyyy-MM-dd" (DateOnly) são interpretadas no fuso local, sem deslocar o dia. */
export function parseDate(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(value);
}

export function formatDate(value?: string | null) {
  if (!value) return '—';
  return parseDate(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatMonthYear(value?: string | null) {
  if (!value) return '';
  return parseDate(value).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

export function formatRelative(value: string) {
  const diff = Date.now() - parseDate(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;
  const months = Math.round(days / 30);
  if (months < 12) return months === 1 ? 'há 1 mês' : `há ${months} meses`;
  return formatDate(value);
}

/** Dias restantes até a data (negativo se já passou). */
export function daysUntil(value: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parseDate(value).getTime() - today.getTime()) / 86400000);
}

export function deadlineLabel(deadline?: string | null) {
  if (!deadline) return null;
  const days = daysUntil(deadline);
  if (days < 0) return 'Inscrições encerradas';
  if (days === 0) return 'Último dia!';
  if (days === 1) return 'Encerra amanhã';
  if (days <= 7) return `Encerra em ${days} dias`;
  return `Até ${formatDate(deadline)}`;
}

export function initials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function firstName(name?: string | null) {
  return name?.trim().split(/\s+/)[0] ?? '';
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function location(city?: string | null, state?: string | null) {
  if (city && state) return `${city}, ${state}`;
  return city || state || '';
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function formatCnpj(value?: string | null) {
  const d = onlyDigits(value ?? '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function splitLines(text?: string | null) {
  return (text ?? '')
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
}

export function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export const missingProfileLabels: Record<string, string> = {
  photo: 'Adicionar uma foto de perfil',
  school: 'Informar sua escola',
  course: 'Informar seu curso',
  location: 'Informar cidade e estado',
  bio: 'Escrever um texto "Sobre mim"',
  skills: 'Cadastrar pelo menos 3 habilidades',
  experience: 'Adicionar uma experiência ou projeto',
};

/** Força da senha de 0 a 4 (mesmas regras do backend). */
export function passwordScore(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score++;
  return password ? Math.max(1, score) : 0;
}

export function passwordProblems(password: string) {
  const problems: string[] = [];
  if (password.length < 8) problems.push('pelo menos 8 caracteres');
  if (!/[A-Z]/.test(password)) problems.push('uma letra maiúscula');
  if (!/[a-z]/.test(password)) problems.push('uma letra minúscula');
  if (!/\d/.test(password)) problems.push('um número');
  return problems;
}

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
