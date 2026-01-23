import Pipeline from '@/components/pages/Pipeline';
import { Suspense } from 'react';

export default function PipelinePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Pipeline />
    </Suspense>
  );
}
