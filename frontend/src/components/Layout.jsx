import Navbar from "./Navbar";

export default function Layout({children}){

  return(

    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0f766e_0%,#155e75_38%,#0f172a_100%)]">

      <Navbar/>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {children}
      </div>

    </div>

  )

}
