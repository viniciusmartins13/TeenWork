import { useState } from 'react';
import { LuBriefcase, LuBuilding2, LuCircleCheck, LuFileText, LuGraduationCap, LuSearch } from 'react-icons/lu';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ErrorState, Skeleton } from '../../components/ui/Feedback';
import { PageHeader, StatCard } from '../../components/ui/Page';
import { Pagination } from '../../components/ui/Pagination';
import { useToast } from '../../context/ToastContext';
import { adminApi } from '../../lib/endpoints';
import { formatDate, formatRelative } from '../../lib/format';
import { useApi, useDebounce, useDocumentTitle } from '../../lib/hooks';

const typeLabels = { Student: 'Estudante', Company: 'Empresa', Admin: 'Admin' } as const;

export function AdminPage() {
  useDocumentTitle('Administração');
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [userType, setUserType] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounce(search.trim(), 350);
  const stats = useApi((signal) => adminApi.stats(signal), []);
  const users = useApi((signal) => adminApi.users({ page, pageSize: 15, search: q || undefined, userType: userType || undefined }, signal), [page, q, userType]);

  return (
    <>
      <PageHeader eyebrow="Administração" title="Painel da plataforma" subtitle="Visão geral e gestão das contas." />
      {stats.error ? (
        <ErrorState compact error={stats.error} onRetry={stats.reload} />
      ) : (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
          <StatCard icon={<LuGraduationCap />} label="Estudantes" value={stats.data?.students ?? '—'} />
          <StatCard icon={<LuBuilding2 />} label="Empresas" value={stats.data?.companies ?? '—'} tone="sky" />
          <StatCard icon={<LuBriefcase />} label="Vagas (ativas)" value={stats.data ? `${stats.data.jobs} (${stats.data.activeJobs})` : '—'} />
          <StatCard icon={<LuFileText />} label="Candidaturas" value={stats.data?.applications ?? '—'} tone="warning" />
          <StatCard icon={<LuCircleCheck />} label="Aprovadas" value={stats.data?.acceptedApplications ?? '—'} tone="success" />
        </div>
      )}

      <section className="card">
        <div className="card__header" style={{ flexWrap: 'wrap' }}>
          <h2 className="card__title">Usuários</h2>
          <div className="row row--wrap">
            <div className="input-group" style={{ width: 260 }}>
              <span className="input-group__icon">
                <LuSearch />
              </span>
              <input className="input" placeholder="Nome ou e-mail" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Buscar usuário" />
            </div>
            <select className="select" style={{ width: 160 }} value={userType} onChange={(e) => { setUserType(e.target.value); setPage(1); }} aria-label="Tipo">
              <option value="">Todos os tipos</option>
              <option value="Student">Estudantes</option>
              <option value="Company">Empresas</option>
              <option value="Admin">Admins</option>
            </select>
          </div>
        </div>
        {users.loading && !users.data ? (
          <div className="stack" style={{ padding: 24 }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} height={36} />)}
          </div>
        ) : users.error ? (
          <ErrorState error={users.error} onRetry={users.reload} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Tipo</th>
                  <th>Cadastro</th>
                  <th>Último acesso</th>
                  <th>Status</th>
                  <th><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {users.data?.items.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="table__title">{u.name}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{u.email}</div>
                    </td>
                    <td>{typeLabels[u.userType]}</td>
                    <td className="text-muted">{formatDate(u.createdAt)}</td>
                    <td className="text-muted">{u.lastLoginAt ? formatRelative(u.lastLoginAt) : 'Nunca'}</td>
                    <td>{u.isActive ? <Badge tone="success" dot>Ativa</Badge> : <Badge tone="danger" dot>Desativada</Badge>}</td>
                    <td className="table__actions">
                      {u.userType !== 'Admin' && (
                        <Button
                          size="sm"
                          variant={u.isActive ? 'danger-ghost' : 'soft'}
                          onClick={async () => {
                            try {
                              await adminApi.setActive(u.id, !u.isActive);
                              users.setData((d) => (d ? { ...d, items: d.items.map((x) => (x.id === u.id ? { ...x, isActive: !u.isActive } : x)) } : d));
                              toast.success(u.isActive ? 'Conta desativada' : 'Conta ativada');
                            } catch (err) {
                              toast.error('Não foi possível alterar', (err as Error).message);
                            }
                          }}
                        >
                          {u.isActive ? 'Desativar' : 'Ativar'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {users.data && (
        <Pagination page={users.data.page} totalPages={users.data.totalPages} totalItems={users.data.totalItems} pageSize={users.data.pageSize} noun={['usuário', 'usuários']} onChange={setPage} />
      )}
    </>
  );
}
