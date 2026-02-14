import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import app from "../../../src/index";
import { COLLECTIONS } from "../../../src/utils/v1/constants";
import { dbConnections } from "../../../src/db/connection";
import { registerAllModels } from "../../../src/db/models/index";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    // Close existing connections if any
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    // Connect to memory server
    const conn = await mongoose.createConnection(uri).asPromise();
    dbConnections.main = conn as any;
    await registerAllModels(conn);

    // Also connect the default mongoose connection
    await mongoose.connect(uri);

    // Initial seed: Create an admin since we don't have one in memory DB
    const AdminModel = conn.models[COLLECTIONS.ADMIN];
    await AdminModel.create({
        name: "Test Admin",
        countryCode: "91",
        phone: "1122334455",
        isEnabled: true,
        isDeleted: false
    });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("User CRUD API Integration Tests", () => {
    let accessToken: string;
    let areaId: string;
    let userId: string;

    const adminPhone = "1122334455";
    const adminCountryCode = "91";

    it("should login as admin and get access token", async () => {
        // Send OTP
        await request(app)
            .post("/v1/admin/auth/otp/send")
            .send({ phone: adminPhone, countryCode: adminCountryCode });

        // Verify OTP
        const res = await request(app)
            .post("/v1/admin/auth/otp/verify")
            .send({ phone: adminPhone, countryCode: adminCountryCode, otp: "1234" });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty("accessToken");
        accessToken = res.body.data.accessToken;
        expect(accessToken).toBeDefined();
        expect(accessToken).not.toBeNull();
        expect(accessToken).not.toBe("undefined");
        console.log(`DEBUG: Obtained accessToken: ${accessToken ? accessToken.substring(0, 10) : 'UNDEFINED'}`);
    });

    it("should create a test area", async () => {
        const res = await request(app)
            .post("/v1/admin/area/create")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                name: "Test Area",
                description: "Test Description",
                city: "Ahmedabad",
                pincode: "380015"
            });

        expect(res.status).toBe(201);
        areaId = res.body.data._id;
    });

    it("should create a new user", async () => {
        const res = await request(app)
            .post("/v1/admin/user/create")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                name: "John Doe",
                countryCode: "91",
                phone: "9876543210",
                address: {
                    houseNo: "123",
                    street: "Main St",
                    area: areaId,
                    city: "Ahmedabad",
                    pincode: "380001"
                },
                waterQuantity: 20,
                notes: "Back door"
            });

        expect(res.status).toBe(201);
        expect(res.body.data).toHaveProperty("_id");
        userId = res.body.data._id;
    });

    it("should get user by ID", async () => {
        const res = await request(app)
            .get(`/v1/admin/user/get/${userId}`)
            .set("Authorization", `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.name).toBe("John Doe");
    });

    it("should update user information", async () => {
        const res = await request(app)
            .put(`/v1/admin/user/update/${userId}`)
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                name: "John Updated",
                waterQuantity: 25
            });

        expect(res.status).toBe(200);

        // Verify update
        const getRes = await request(app)
            .get(`/v1/admin/user/get/${userId}`)
            .set("Authorization", `Bearer ${accessToken}`);
        expect(getRes.body.data.name).toBe("John Updated");
        expect(getRes.body.data.waterQuantity).toBe(25);
    });

    it("should create multiple users for getAll testing", async () => {
        const users = [
            { name: "Alice", phone: "9000000001", countryCode: "91", address: { houseNo: "1", street: "A", area: areaId, city: "Ahmedabad", pincode: "380001" }, waterQuantity: 10 },
            { name: "Bob", phone: "9000000002", countryCode: "91", address: { houseNo: "2", street: "B", area: areaId, city: "Surat", pincode: "395001" }, waterQuantity: 15 },
            { name: "Charlie", phone: "9000000003", countryCode: "91", address: { houseNo: "3", street: "C", area: areaId, city: "Ahmedabad", pincode: "380002" }, waterQuantity: 30 }
        ];

        for (const user of users) {
            await request(app)
                .post("/v1/admin/user/create")
                .set("Authorization", `Bearer ${accessToken}`)
                .send(user);
        }
    });

    it("should search users (Charlie)", async () => {
        const res = await request(app)
            .post("/v1/admin/user/getAll")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ search: "Charlie" });

        expect(res.status).toBe(200);
        expect(res.body.data.totalCount).toBe(1);
        expect(res.body.data.tableData[0].name).toBe("Charlie");
    });

    it("should filter users by city (Ahmedabad)", async () => {
        const res = await request(app)
            .post("/v1/admin/user/getAll")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ filters: { "address.city": "Ahmedabad" } });

        expect(res.status).toBe(200);
        // John Updated, Alice, Charlie are in Ahmedabad
        expect(res.body.data.totalCount).toBe(3);
    });

    it("should sort users by name DESC", async () => {
        const res = await request(app)
            .post("/v1/admin/user/getAll")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ sortBy: "name", sortDesc: true });

        expect(res.status).toBe(200);
        expect(res.body.data.tableData[0].name).toBe("John Updated"); // J comes after C, B, A
    });

    it("should paginate users (page 2, size 2)", async () => {
        const res = await request(app)
            .post("/v1/admin/user/getAll")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ page: 2, itemsPerPage: 2 });

        expect(res.status).toBe(200);
        expect(res.body.data.tableData.length).toBe(2);
    });

    it("should project specific fields", async () => {
        const res = await request(app)
            .post("/v1/admin/user/getAll")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ projection: { name: 1, phone: 1 }, itemsPerPage: 1 });

        expect(res.status).toBe(200);
        const user = res.body.data.tableData[0];
        expect(user).toHaveProperty("name");
        expect(user).toHaveProperty("phone");
        expect(user).not.toHaveProperty("address");
    });

    it("should soft delete a user", async () => {
        const res = await request(app)
            .delete(`/v1/admin/user/delete/${userId}`)
            .set("Authorization", `Bearer ${accessToken}`);

        expect(res.status).toBe(200);

        // Verify soft delete
        const getRes = await request(app)
            .get(`/v1/admin/user/get/${userId}`)
            .set("Authorization", `Bearer ${accessToken}`);
        expect(getRes.status).toBe(404);

        const listRes = await request(app)
            .post("/v1/admin/user/getAll")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({});
        expect(listRes.body.data.totalCount).toBe(3); // 4 users total, 1 deleted
    });
});
