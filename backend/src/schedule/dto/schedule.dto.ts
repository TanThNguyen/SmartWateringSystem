// import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
// import { Device } from '../device/device.entity';

// @Entity()
// export class Schedule {
//   @PrimaryGeneratedColumn('uuid')
//   scheduleId: string;

//   @Column()
//   deviceId: string;

//   @Column({ type: 'timestamp' })
//   startTime: Date;

//   @Column({ type: 'timestamp' })
//   endTime: Date;

//   @Column({ type: 'int', default: 0 }) // Lưu bitmask ngày (CN-T7)
//   repeatDays: number;

//   @Column({ default: true })
//   isActive: boolean;

//   @ManyToOne(() => Device, (device) => device.schedules, { onDelete: 'CASCADE' })
//   device: Device;
// }
