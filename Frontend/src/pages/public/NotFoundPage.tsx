import { LuArrowLeft, LuHouse } from 'react-icons/lu';
import { Link, useNavigate } from 'react-router-dom';
import { homePathFor, useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../lib/hooks';

export function NotFoundPage() {
  useDocumentTitle('Página não encontrada');
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="not-found">
      <div className="stack" style={{ alignItems: 'center' }}>
        <div className="not-found__code">404</div>
        <h1 style={{ fontSize: 28 }}>Essa página saiu para o intervalo</h1>
        <p className="text-muted" style={{ maxWidth: 420 }}>
          O endereço pode ter mudado ou a página não existe mais. Que tal voltar e continuar de onde parou?
        </p>
        <div className="row row--wrap" style={{ justifyContent: 'center', marginTop: 8 }}>
          <button type="button" className="btn btn--secondary" onClick={() => navigate(-1)}>
            <LuArrowLeft /> Voltar
          </button>
          <Link to={homePathFor(user?.role)} className="btn btn--primary">
            <LuHouse /> Ir para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
