import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import ProductForm from '../ProductForm';

export default async function EditProductPage({
  params,
}: {
  params: { adminPath: string; id: string };
}) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
  });

  if (!product) {
    notFound();
  }

  return (
    <ProductForm
      adminPath={params.adminPath}
      isEdit={true}
      initialData={{
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        category: product.category,
        price: product.price,
        mrp: product.mrp,
        stock: product.stock,
        images: product.images,
        isActive: product.isActive,
        isBestSeller: product.isBestSeller,
        isNewArrival: product.isNewArrival,
        taxRate: product.taxRate,
        hsnCode: product.hsnCode,
      }}
    />
  );
}
