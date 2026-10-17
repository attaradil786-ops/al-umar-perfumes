import { redirect } from 'next/navigation';

export default function OrderSuccessRedirect({
  params,
}: {
  params: { orderNumber: string };
}) {
  redirect(`/order-confirmation/${params.orderNumber}`);
}
