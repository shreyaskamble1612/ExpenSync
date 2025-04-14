// import {
//   SignedOut,
//   SignInButton,
//   SignedIn,
//   UserButton,
//   SignUpButton,
// } from "@clerk/nextjs";
// import Image from "next/image";
// import Link from "next/link";
// import { Button } from "./ui/button";
// import { LayoutDashboard, PenBox } from "lucide-react";
// import { checkUser } from "@/lib/checkUser";

// const Header = async () => {
//   await checkUser();
//   return (
//     <div className="fixed top-0 left-0 w-full bg-white/80 backdrop=blur-md z-50 border-b">
//       <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
//         <Link href="/">
//           <Image
//             src={"/logo.png"}
//             alt="Logo"
//             height={60}
//             width={200}
//             className="h-12 w-auto object-contain"
//           />
//         </Link>
//         <div className="flex items-center space-x-4 ">
//           <SignedIn>
//             <Link href={"/dashboard"} className="text-gray-600 hover:text-blue,flex items-center gap-2">
//               <Button variant="outline">
//                 <LayoutDashboard size={18} />
//                 <span className="hidden md:inline">Dashboard</span>
//               </Button>
//             </Link>
//             <Link href={"/transactions/create"}>
//               <Button className="flex items-center gap-2">
//                 <PenBox size={18} />
//                 <span className="hidden md:inline">Add Transactions</span>
//               </Button>
//             </Link>
//           </SignedIn>
//           <SignedOut>
//             <SignInButton forceRedirectUrl="/dashboard">
//               <Button variant="outline">Sign In</Button>
//             </SignInButton>
//           </SignedOut>
//           <SignedIn>
//             <UserButton appearance={{
//               elements:{
//                 avatarBox:{
//                   width:"40px",
//                   height:"40px",
//                 },
//               }
//             }}/>
//           </SignedIn>
//         </div>
//       </nav>
//     </div>
//   );
// };

// export default Header;



"use client";

import {
  SignedOut,
  SignInButton,
  SignedIn,
  UserButton,
  SignUpButton,
} from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { LayoutDashboard, PenBox } from "lucide-react";

const Header = () => {
  return (
    <div className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <Image
            src={"/logo.png"}
            alt="Logo"
            height={60}
            width={200}
            className="h-12 w-auto object-contain"
          />
        </Link>
        <div className="flex items-center space-x-4">
          <SignedIn>
            <Button variant="outline" asChild>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-500"
              >
                <LayoutDashboard size={18} />
                <span className="hidden md:inline">Dashboard</span>
              </Link>
            </Button>
            <Button asChild>
              <Link
                href="/transactions/create"
                className="flex items-center gap-2"
              >
                <PenBox size={18} />
                <span className="hidden md:inline">Add Transactions</span>
              </Link>
            </Button>
          </SignedIn>

          <SignedOut>
            <SignInButton forceRedirectUrl="/dashboard">
              <Button variant="outline">Sign In</Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: {
                    width: "40px",
                    height: "40px",
                  },
                },
              }}
            />
          </SignedIn>
        </div>
      </nav>
    </div>
  );
};

export default Header;
