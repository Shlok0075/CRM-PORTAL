import { SetMetadata } from '@nestjs/common'

export const RequiresPermission = (permission: string) => SetMetadata('permission', permission)
