export default function DecorativeBlobs() {
  return (
    <div className="fixed top-0 right-0 -z-10 w-1/2 h-screen opacity-20 pointer-events-none">
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary-container/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary-container/20 blur-[100px] rounded-full" />
    </div>
  );
}
