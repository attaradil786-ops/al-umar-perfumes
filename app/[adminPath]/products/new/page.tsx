import ProductForm from '../ProductForm';

export default function NewProductPage({
  params,
}: {
  params: { adminPath: string };
}) {
  return <ProductForm adminPath={params.adminPath} isEdit={false} />;
}
