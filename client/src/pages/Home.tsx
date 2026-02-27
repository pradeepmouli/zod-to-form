import { Check, ArrowRight, ArrowRightCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 pb-24 font-sans selection:bg-brand-pink/20 selection:text-brand-pink">
      {/* Header */}
      <header className="py-12 flex flex-col items-center justify-center text-center space-y-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          {/* Main Logo */}
          <div className="flex items-center gap-6 mb-4">
            <LogoIcon size="xl" />
            <h1 className="text-6xl font-bold tracking-tight text-slate-900">
              zod-to-form
            </h1>
          </div>
          <p className="text-xl text-slate-600 font-medium">
            Schema <span className="text-slate-400 mx-1">→</span> Form <span className="mx-2">•</span> 
            <span className="text-brand-teal">React Hook Form</span> + <span className="text-brand-pink">Zod</span>
          </p>
        </motion.div>

        {/* Badges */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex gap-4"
        >
          <Badge variant="outline" className="text-base px-4 py-1.5 shadow-sm bg-white border-slate-200 text-slate-700">
            <Check className="w-4 h-4 text-brand-teal mr-2" /> Type-Safe
          </Badge>
          <Badge variant="outline" className="text-base px-4 py-1.5 shadow-sm bg-white border-slate-200 text-slate-700">
            <svg className="w-4 h-4 text-brand-teal mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
            Auto Forms
          </Badge>
          <Badge variant="outline" className="text-base px-4 py-1.5 shadow-sm bg-white border-slate-200 text-slate-700">
            <svg className="w-4 h-4 text-brand-teal mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            React
          </Badge>
        </motion.div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 space-y-16">
        
        {/* Logo Variants Section */}
        <section>
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px bg-slate-200 flex-1 max-w-[100px]"></div>
            <h2 className="text-sm font-bold tracking-widest text-slate-400 uppercase">LOGO VARIANTS</h2>
            <div className="h-px bg-slate-200 flex-1 max-w-[100px]"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card title="Vertical">
              <div className="flex flex-col items-center gap-4">
                <LogoIcon size="lg" />
                <span className="text-2xl font-bold">zod-to-form</span>
              </div>
            </Card>
            
            <Card title="Horizontal">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-brand-pink transform rotate-3 rounded-lg"></div>
                  <div className="bg-white relative p-2 border-2 border-slate-900 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-slate-900">Z</span>
                  </div>
                </div>
                <ArrowRight className="text-brand-teal w-6 h-6" />
                <div className="bg-white p-2 border-2 border-slate-900 rounded-lg">
                  <div className="w-6 h-1.5 bg-slate-900 rounded-full mb-1"></div>
                  <div className="flex gap-1 items-center">
                    <div className="w-4 h-1.5 bg-slate-900 rounded-full"></div>
                    <div className="w-2 h-2 bg-brand-teal rounded-sm"></div>
                  </div>
                </div>
              </div>
              <span className="text-xl font-bold mt-4">zod-to-form</span>
            </Card>
            
            <Card title="Code">
              <div className="flex items-center gap-3">
                <LogoIcon size="sm" />
                <span className="text-xl font-bold">zod-to-form</span>
              </div>
              <div className="mt-3 text-sm font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100">
                {'<Zod → Form />'}
              </div>
            </Card>

            <Card title="App Icon">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-pink to-brand-magenta flex items-center justify-center shadow-lg shadow-brand-pink/20">
                <div className="w-14 h-10 bg-white rounded-lg p-2 shadow-sm">
                  <div className="w-8 h-1.5 bg-slate-200 rounded-full mb-2"></div>
                  <div className="flex gap-2 items-center">
                    <div className="w-4 h-1.5 bg-slate-200 rounded-full"></div>
                    <div className="w-3 h-3 bg-brand-teal rounded-sm flex items-center justify-center">
                      <Check className="w-2 h-2 text-white" strokeWidth={4} />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Dark Mode & Colors Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {/* Dark Mode Variants */}
            <div className="rounded-3xl bg-[#121629] overflow-hidden shadow-xl relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-pink/10 to-brand-teal/10 opacity-50 mix-blend-overlay"></div>
              
              <div className="p-10 relative z-10">
                <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-8">DARK MODE</h3>
                
                <div className="space-y-10">
                  <div className="flex items-center gap-6">
                    <LogoIcon size="lg" />
                    <div>
                      <h3 className="text-4xl font-bold text-white mb-2">zod-to-form</h3>
                      <p className="text-brand-teal text-lg">React Hook Form <span className="text-slate-400">+</span> <span className="text-brand-pink">Zod</span></p>
                      <div className="w-12 h-1 bg-gradient-to-r from-brand-teal to-brand-pink mt-3 rounded-full"></div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <LogoIcon size="md" />
                      <div>
                        <h4 className="text-2xl font-bold text-white">zod-to-form</h4>
                        <p className="text-slate-400 text-sm">Generate Forms from Zod Schemas</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center bg-[#1A1F35] rounded-xl p-2 pr-6 border border-white/5">
                      <div className="font-mono text-sm text-slate-300 bg-white/5 px-4 py-3 rounded-lg border border-white/5">
                        z.object({"{"}...{"}"})
                      </div>
                      <ArrowRightCircle className="text-brand-teal w-6 h-6 mx-4" />
                      <div className="bg-white rounded-lg p-3 shadow-lg shadow-black/20 transform rotate-2">
                        <div className="w-8 h-2 bg-slate-200 rounded-full mb-2"></div>
                        <div className="w-12 h-2 bg-slate-200 rounded-full mb-3"></div>
                        <div className="bg-brand-teal text-white text-[10px] font-bold px-3 py-1 rounded">Submit</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Colors Section */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-6 text-center">COLORS</h3>
              
              <div className="grid grid-cols-4 gap-3">
                <ColorSwatch color="#FF4D8D" name="Pink" />
                <ColorSwatch color="#E11D8E" name="Magenta" />
                <ColorSwatch color="#14B8A6" name="Teal" />
                <ColorSwatch color="#0F172A" name="Dark" />
              </div>
            </div>

            {/* Icons Section */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-6 text-center">ICONS</h3>
              
              <div className="flex justify-center items-end gap-6">
                <LogoIcon size="lg" />
                <LogoIcon size="md" />
                
                {/* Monochromatic Variant */}
                <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center">
                   <div className="w-6 h-6 border-2 border-white rounded flex items-center justify-center p-1">
                     <div className="w-full flex flex-col gap-0.5">
                       <div className="w-full h-0.5 bg-white rounded-full"></div>
                       <div className="flex gap-0.5">
                          <div className="w-1/2 h-0.5 bg-white rounded-full"></div>
                          <div className="w-1/2 h-0.5 bg-white rounded-full"></div>
                       </div>
                     </div>
                   </div>
                </div>

                {/* Dark Outline Variant */}
                <div className="relative">
                  <div className="w-12 h-12 bg-white border-2 border-slate-900 rounded-xl flex items-center justify-center rotate-45 transform">
                     <div className="-rotate-45 flex flex-col gap-1 w-5">
                       <div className="w-full h-1 bg-slate-900 rounded-full"></div>
                       <div className="w-2/3 h-1 bg-slate-900 rounded-full"></div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>

      </main>
    </div>
  );
}

// Components

function Card({ children, title }: { children: React.ReactNode, title: string }) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-pink to-brand-teal opacity-0 group-hover:opacity-100 transition-opacity"></div>
      {children}
    </div>
  );
}

function LogoIcon({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  };

  const innerSizes = {
    sm: "w-4 h-3 p-0.5",
    md: "w-7 h-5 p-1",
    lg: "w-9 h-6 p-1.5",
    xl: "w-14 h-10 p-2"
  };

  return (
    <div className={`${sizes[size]} relative flex items-center justify-center drop-shadow-md`}>
      {/* Pentagon background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-pink to-brand-magenta transform rotate-[-5deg] rounded-[20%] skew-x-[-5deg] scale-y-110" style={{
        clipPath: 'polygon(50% 100%, 0 70%, 0 0, 100% 0, 100% 70%)'
      }}></div>
      
      {/* Inner White Form */}
      <div className={`bg-white rounded-sm ${innerSizes[size]} relative z-10 shadow-sm flex flex-col justify-between`}>
        {/* Top Line */}
        <div className="w-full bg-slate-200 rounded-full" style={{ height: size === 'xl' ? '6px' : size === 'lg' ? '4px' : '2px' }}></div>
        
        {/* Bottom Area with Checkmark */}
        <div className="flex gap-1 items-end justify-between w-full h-full pb-[2px]">
          <div className="w-[50%] bg-slate-200 rounded-full" style={{ height: size === 'xl' ? '6px' : size === 'lg' ? '4px' : '2px' }}></div>
          <div className="bg-brand-teal rounded-sm flex items-center justify-center" style={{ 
            width: size === 'xl' ? '16px' : size === 'lg' ? '12px' : size === 'md' ? '8px' : '6px',
            height: size === 'xl' ? '16px' : size === 'lg' ? '12px' : size === 'md' ? '8px' : '6px'
          }}>
            <Check className="text-white" strokeWidth={4} style={{
              width: size === 'xl' ? '10px' : size === 'lg' ? '8px' : size === 'md' ? '6px' : '4px',
              height: size === 'xl' ? '10px' : size === 'lg' ? '8px' : size === 'md' ? '6px' : '4px'
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorSwatch({ color, name }: { color: string, name: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className="w-full aspect-square rounded-2xl shadow-sm border border-black/5" 
        style={{ backgroundColor: color }}
      ></div>
      <div className="text-center">
        <div className="text-[10px] font-mono text-slate-400 mt-1">{color}</div>
      </div>
    </div>
  );
}