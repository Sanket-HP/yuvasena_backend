"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    await prisma.auditLog.deleteMany({});
    await prisma.complaint.deleteMany({});
    await prisma.attendance.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.booth.deleteMany({});
    await prisma.taluka.deleteMany({});
    await prisma.district.deleteMany({});
    await prisma.news.deleteMany({});
    await prisma.gallery.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.settings.deleteMany({});
    const districtsData = [
        {
            name: 'Mumbai City',
            talukas: [
                { name: 'Colaba', booths: ['Booth 101', 'Booth 102'] },
                { name: 'Byculla', booths: ['Booth 201', 'Booth 202'] }
            ]
        },
        {
            name: 'Pune',
            talukas: [
                { name: 'Haveli', booths: ['Booth 301', 'Booth 302'] },
                { name: 'Shirur', booths: ['Booth 401', 'Booth 402'] }
            ]
        },
        {
            name: 'Thane',
            talukas: [
                { name: 'Kalyan', booths: ['Booth 501', 'Booth 502'] },
                { name: 'Ulhasnagar', booths: ['Booth 601', 'Booth 602'] }
            ]
        }
    ];
    console.log('Creating geographical structure...');
    for (const dist of districtsData) {
        const district = await prisma.district.create({
            data: { name: dist.name, state: 'Maharashtra' }
        });
        for (const tal of dist.talukas) {
            const taluka = await prisma.taluka.create({
                data: { name: tal.name, districtId: district.id }
            });
            for (const bth of tal.booths) {
                await prisma.booth.create({
                    data: { boothNo: bth.split(' ')[1], name: bth, talukaId: taluka.id }
                });
            }
        }
    }
    console.log('Creating Super Admin account...');
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const superAdmin = await prisma.user.create({
        data: {
            email: 'admin@yuvasena.org',
            phone: '9999999999',
            password: adminPasswordHash,
            name: 'Super Admin',
            role: client_1.Role.SUPER_ADMIN
        }
    });
    console.log('Creating sample member and accounts...');
    const memberPasswordHash = await bcrypt.hash('Member@123', 10);
    const sampleDistrict = await prisma.district.findFirst();
    const sampleTaluka = await prisma.taluka.findFirst({
        where: { districtId: sampleDistrict?.id }
    });
    const sampleBooth = await prisma.booth.findFirst({
        where: { talukaId: sampleTaluka?.id }
    });
    if (sampleDistrict && sampleTaluka && sampleBooth) {
        const memberUser = await prisma.user.create({
            data: {
                email: 'rahul.k@gmail.com',
                phone: '9876543210',
                password: memberPasswordHash,
                name: 'Rahul Kulkarni',
                role: client_1.Role.MEMBER
            }
        });
        await prisma.member.create({
            data: {
                userId: memberUser.id,
                membershipNo: 'YS-2026-0001',
                status: 'APPROVED',
                qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=YS-2026-0001',
                bloodGroup: 'O+',
                occupation: 'Software Engineer',
                address: '101, Shivneri Apartments, Senapati Bapat Marg, Pune',
                districtId: sampleDistrict.id,
                talukaId: sampleTaluka.id,
                boothId: sampleBooth.id,
                profilePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=150&h=150&q=80'
            }
        });
    }
    console.log('Creating sample news...');
    await prisma.news.createMany({
        data: [
            {
                title: 'Yuva Sena State Youth Summit 2026 Announced',
                content: 'Yuva Sena President announced the grand schedule for the annual State Youth Summit to be held in Mumbai this November. Over 50,000 volunteers are expected to attend the event which aims to focus on youth employment, skill development programs, and local leadership workshops.',
                category: 'Summit',
                imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?fit=crop&w=800&h=450&q=80',
                isTrending: true,
                publishStatus: 'PUBLISHED',
                publishAt: new Date()
            },
            {
                title: 'Free Digital Skills Training Bootcamps across Districts',
                content: 'Yuva Sena is launching computer literacy and modern coding bootcamps across 15 districts of Maharashtra. These bootcamps will offer certified courses in Python, digital marketing, and web design, absolutely free for college student cardholders.',
                category: 'Education',
                imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?fit=crop&w=800&h=450&q=80',
                isTrending: false,
                publishStatus: 'PUBLISHED',
                publishAt: new Date()
            }
        ]
    });
    console.log('Creating sample events...');
    await prisma.event.createMany({
        data: [
            {
                title: 'Blood Donation Camp & Health Checkup',
                description: 'Join hands with Yuva Sena for the annual mega blood donation camp. Standard health screens and consultations with top specialists will be available for free to all registered citizens.',
                date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                location: 'Shivaji Park, Dadar, Mumbai',
                latitude: 19.0264,
                longitude: 72.8375,
                maxRegistrations: 1000,
                bannerUrl: 'https://images.unsplash.com/photo-1615461066841-4f104785c3b7?fit=crop&w=800&h=450&q=80',
                status: 'UPCOMING'
            },
            {
                title: 'Tree Plantation & Environmental Drive',
                description: 'Let us pledge to build a greener Maharashtra. Planting over 10,000 saplings in Pune and nearby talukas. Volunteers will be provided transportation, plantation equipment, and refreshments.',
                date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                location: 'Vetal Tekdi, Kothrud, Pune',
                latitude: 18.5284,
                longitude: 73.8183,
                maxRegistrations: 500,
                bannerUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?fit=crop&w=800&h=450&q=80',
                status: 'UPCOMING'
            }
        ]
    });
    await prisma.settings.createMany({
        data: [
            { key: 'app_version', value: '1.0.0' },
            { key: 'maintenance_mode', value: 'false' },
            { key: 'support_phone', value: '+91-9999988888' },
            { key: 'support_email', value: 'support@yuvasena.org' }
        ]
    });
    console.log('Database seeding complete successfully!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map