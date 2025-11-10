import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RefillRequestService {
  private requests = new Map<
    string,
    { technicianId: string; refillAmount: number; createdAt: Date }
  >();

  create(partId: string, technicianId: string, refillAmount: number): string {
    const requestId = uuidv4();
    this.requests.set(partId, {
      technicianId,
      refillAmount,
      createdAt: new Date(),
    });

    setTimeout(() => this.requests.delete(partId), 24 * 60 * 60 * 1000);

    return requestId;
  }

  getAndRemove(partId: string): { technicianId: string; refillAmount: number } | null {
    const req = this.requests.get(partId);
    this.requests.delete(partId);
    return req ?? null;
  }
}
