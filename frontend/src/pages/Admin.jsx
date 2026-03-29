import CreateUser from "../components/CreateUser";

export default function Admin() {
  return (
    <div className="mx-auto w-full max-w-3xl animate-fade-in">
      <div className="glass-card p-6 mb-5">
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#908fa0] font-semibold">Administration</p>
        <h1 className="mt-2 text-3xl font-bold gradient-text">Admin Panel</h1>
        <p className="mt-1 text-sm text-[#c7c4d7]">Manage venue owners and platform settings.</p>
      </div>
      <CreateUser />
    </div>
  );
}
