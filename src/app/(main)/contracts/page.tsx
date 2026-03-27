import { ContractsPageContent } from "@/features/contracts/components/page/ContractsPageContent";

type ContractsPageProps = {
  searchParams: Promise<{
    new?: string;
  }>;
};

export default async function ContractsPage({ searchParams }: ContractsPageProps) {
  const resolvedSearchParams = await searchParams;

  return <ContractsPageContent shouldOpenCreateModal={resolvedSearchParams.new === "1"} />;
}
