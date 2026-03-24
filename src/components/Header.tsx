import { Wifi, WifiOff } from "lucide-react";

interface HeaderProps {
  isConnected: boolean;
}

const Header = ({ isConnected }: HeaderProps) => {
  return (
    <header className="glass-card flex items-center justify-between px-6 py-4 mb-6">
      <h1 className="text-xl font-bold tracking-tight">
        <span className="text-foreground">ROB</span>{" "}
        <span className="text-primary">AI</span>
      </h1>

      <div
        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium ${
        isConnected ?
        "bg-neon-green/10 text-neon-green" :
        "bg-destructive/10 text-destructive"}`
        }>
        
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isConnected ? "bg-neon-green animate-ping" : "bg-destructive"}`
            } />
          
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
            isConnected ? "bg-neon-green" : "bg-destructive"}`
            } />
          
        </span>
        {isConnected ?
        <>
            <Wifi size={14} /> Local Core: Online
          </> :

        <>
            <WifiOff size={14} /> Local Core: Offline
          </>
        }
      </div>
    </header>);

};

export default Header;