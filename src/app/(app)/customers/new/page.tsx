import { PageHeader } from "@/components/page-header";
import { CustomerForm } from "../customer-form";
import { createCustomer } from "../actions";

export default function NewCustomerPage() {
  return (
    <>
      <PageHeader title="New customer" description="Add a company you sell to." />
      <CustomerForm action={createCustomer} />
    </>
  );
}
