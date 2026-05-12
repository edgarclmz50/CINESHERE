import { StreamingService } from "../types";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

interface ServiceRowProps {
  title: string;
  services: StreamingService[];
  onPlayExternal: (url: string) => void;
}

export default function ServiceRow({ title, services, onPlayExternal }: ServiceRowProps) {
  const handleOpenService = (service: StreamingService) => {
    if (service.allowIframe === false) {
      window.open(service.url, "_blank", "noopener,noreferrer");
    } else {
      onPlayExternal(service.url);
    }
  };

  return (
    <div className="space-y-4 px-4 md:px-12 my-12 group">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white md:text-2xl tracking-tight">
          {title}
        </h3>
        <div className="flex items-center gap-2 text-blue-500 text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded border border-blue-500/20">
           <ShieldCheck className="w-3 h-3" />
           AI Shield Active
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {services.map((service) => (
          <motion.div
            key={service.id}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
            onClick={() => handleOpenService(service)}
            className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-4 cursor-pointer transition-all flex flex-col gap-4 group/card relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover/card:opacity-100 transition-opacity" />
            
            <div className="flex items-center justify-between">
               <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{service.category}</span>
               <ExternalLink className="w-4 h-4 text-gray-600 group-hover/card:text-white transition-colors" />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-white/5 overflow-hidden border border-white/10 shrink-0">
                <img src={service.logo} className="w-full h-full object-cover" alt={service.name} />
              </div>
              <div>
                <p className="font-bold text-white group-hover/card:text-blue-500 transition-colors uppercase tracking-tight">{service.name}</p>
                <p className="text-[10px] text-gray-500">streaming.secure.ai</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
