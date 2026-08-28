import { lazy, Suspense, useEffect, useState } from "react";

const loadWarehouse = () => import("./Warehouse");
if (typeof window !== "undefined") {
  void loadWarehouse();
}
const Warehouse = lazy(loadWarehouse);

function WarehouseSkeleton() {
  return (
    <div className="warehouse-skeleton" aria-hidden="true">
      <div className="warehouse-skeleton-grid" />
    </div>
  );
}

export function SceneHost() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <WarehouseSkeleton />;

  return (
    <Suspense fallback={<WarehouseSkeleton />}>
      <Warehouse />
    </Suspense>
  );
}
