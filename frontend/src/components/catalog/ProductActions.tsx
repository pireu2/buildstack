"use client";

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useCopilot } from '@/context/CopilotContext';

export function ProductActions({ productContext }: { productContext: any }) {
  const { openCopilot, setProductContext } = useCopilot();

  // Keep the active product context in sync when viewing this product
  useEffect(() => {
    if (productContext) {
      setProductContext(productContext);
    }
  }, [productContext, setProductContext]);

  return (
    <div className="flex items-center gap-2.5">
      <Button
        onClick={() => openCopilot(productContext)}
        variant="outline"
        size="sm"
        className="h-10 px-4 border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
      >
        <MessageSquare className="h-4 w-4 text-amber-600" />
        <span>Ask Copilot</span>
      </Button>
    </div>
  );
}
