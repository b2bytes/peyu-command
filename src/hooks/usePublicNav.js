// Hook para inyectar PublicNavBar en páginas públicas
// Exporta el componente listo para usar
import PublicNavBar from '@/components/PublicNavBar';

export function withPublicNav(Component) {
  return function ComponentWithNav(props) {
    return (
      <>
        <PublicNavBar />
        <Component {...props} />
      </>
    );
  };
}

export default PublicNavBar;