import { SetMetadata } from '@nestjs/common';

export const AUTO_AUDIT_KEY = 'AUTO_AUDIT';
export const AutoAudit = () => SetMetadata(AUTO_AUDIT_KEY, true);