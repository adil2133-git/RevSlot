import MeetingRoom from "@/features/meeting/components/MeetingRoom";

export default async function MeetingPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { bookingId } = await params;
  const { token } = await searchParams;

  const id = Number(bookingId);

  if (!Number.isInteger(id) || !token) {
    return (
      <div className="mx-auto mt-20 max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        Invalid meeting link.
      </div>
    );
  }

  return (
    <MeetingRoom
      bookingId={id}
      token={token}
    />
  );
}