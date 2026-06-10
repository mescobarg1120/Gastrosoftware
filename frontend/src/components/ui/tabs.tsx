import * as React from "react"
import { cn } from "@/lib/utils"

const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
} | null>(null)

function Tabs({
  value,
  onValueChange,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  value: string
  onValueChange: (value: string) => void
}) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props} />
    </TabsContext.Provider>
  )
}

function TabsList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-lg bg-muted p-0.5 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, value, ...props }: React.ComponentProps<"button"> & { value: string }) {
  const ctx = React.useContext(TabsContext)
  const active = ctx?.value === value
  return (
    <button
      data-slot="tabs-trigger"
      data-active={active}
      className={cn(
        "inline-flex h-full items-center justify-center rounded-md px-2.5 text-sm font-medium whitespace-nowrap transition-colors",
        "data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm",
        "text-muted-foreground hover:text-foreground",
        className
      )}
      onClick={() => ctx?.onValueChange(value)}
      {...props}
    />
  )
}

function TabsContent({ className, value, ...props }: React.ComponentProps<"div"> & { value: string }) {
  const ctx = React.useContext(TabsContext)
  if (ctx?.value !== value) return null
  return (
    <div data-slot="tabs-content" className={cn("outline-none", className)} {...props} />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
