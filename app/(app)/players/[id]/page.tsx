import { PlayerDetailView } from "@/components/player-detail-view";

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PlayerDetailView id={id} />;
}
