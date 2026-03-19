import CreateUser from "../components/CreateUser";

export default function Admin(){

  return(

    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">Administration</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Admin Panel</h1>
      </div>
      <CreateUser/>
    </div>

  )

}
