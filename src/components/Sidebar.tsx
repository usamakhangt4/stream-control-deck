import { LayoutDashboard, Layers, Volume2, Eye, OctagonX } from "lucide-react"
import {
  Sidebar as ShadcnSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export type ActiveTab = "core" | "scenes" | "audio" | "sources"

interface SidebarProps {
  activeTab: ActiveTab
  onSelectTab: (tab: ActiveTab) => void
  onEndStream?: () => void
}

export function Sidebar({ activeTab, onSelectTab, onEndStream }: SidebarProps) {
  const navItems = [
    { id: "core" as ActiveTab, label: "Core", icon: LayoutDashboard },
    { id: "scenes" as ActiveTab, label: "Scenes", icon: Layers },
    { id: "audio" as ActiveTab, label: "Audio", icon: Volume2 },
    { id: "sources" as ActiveTab, label: "Sources", icon: Eye },
  ]

  return (
    <ShadcnSidebar
      collapsible="none"
      className="w-20 border-r border-border bg-card"
    >
      {/* 1. Header Logo */}
      <SidebarHeader className="items-center py-4">
        <div className="flex flex-col items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/50 bg-purple-600/20 font-mono text-xs font-bold text-purple-400">
            DS
          </div>
          <span className="mt-1 font-mono text-[9px] font-bold tracking-tighter text-muted-foreground">
            DECK OS
          </span>
        </div>
      </SidebarHeader>

      {/* 2. Navigation Items */}
      <SidebarContent className="px-2">
        <SidebarMenu className="gap-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={isActive}
                  onClick={() => onSelectTab(item.id)}
                  tooltip={item.label}
                  className={`flex h-auto flex-col items-center gap-1 rounded-xl py-2.5 text-[10px] font-medium transition-all ${
                    isActive
                      ? "border border-purple-500/40 bg-purple-600/20 text-purple-400 shadow-sm shadow-purple-950/50"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* 3. Emergency End Stream Button */}
      <SidebarFooter className="items-center pb-4">
        <Dialog>
          <DialogTrigger>
            <button className="group flex h-14 w-14 flex-col items-center justify-center rounded-xl border border-red-500/40 bg-red-500/10 text-[10px] font-bold text-red-500 shadow-lg shadow-red-950/40 transition-all hover:bg-red-500 hover:text-white">
              <OctagonX className="mb-0.5 h-5 w-5 transition-transform group-hover:scale-110" />
              END
            </button>
          </DialogTrigger>

          <DialogContent className="border-border bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-500">
                <OctagonX className="h-5 w-5" /> End Live Broadcast?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                This will safely stop your OBS stream and disconnect all live
                platform feeds. Are you sure?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose>
                <Button variant="outline" className="border-border">
                  Cancel
                </Button>
              </DialogClose>
              <DialogClose>
                <Button
                  variant="destructive"
                  onClick={onEndStream}
                  className="bg-red-600 hover:bg-red-500"
                >
                  End Stream Now
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarFooter>
    </ShadcnSidebar>
  )
}
