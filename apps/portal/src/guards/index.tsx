import { useUser } from '@/hooks/users/useUser';
import { PublicRoutes } from '@/router';
import { Loader } from 'lucide-react';
import { Navigate, Outlet } from 'react-router-dom';

interface Props {
  privateValidation: boolean;
}

const PrivateValidationFragment = <Outlet />;
const PublicValidationFragment = (
  <Navigate to={"/"} replace />
)

const GuardRoute = ({privateValidation}: Props) => {
  const { isLoading } = useUser();

  if(isLoading) return <Loader />

  return true ? (
    privateValidation ? (
        PrivateValidationFragment
    ): (
        PublicValidationFragment
    )
) : (
    <Navigate replace to={PublicRoutes.LOGIN} />
) 
}

export default GuardRoute