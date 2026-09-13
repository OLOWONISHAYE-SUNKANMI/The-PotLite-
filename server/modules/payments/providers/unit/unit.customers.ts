import { UnitClient, unitClient } from "./unit.client";
import { CreateCustomerInput, CustomerResult } from "../../domain/payment-types";

// In-memory customer store for sandbox simulation fallback
const mockCustomers = new Map<string, any>();

export class UnitCustomers {
  constructor(private client: UnitClient = unitClient) {}

  public async createIndividualCustomer(input: CreateCustomerInput): Promise<CustomerResult> {
    if (this.client.isMockMode()) {
      return this.mockCreateCustomer(input);
    }

    try {
      const nameParts = (input.fullName || "Test User").trim().split(" ");
      const first = nameParts[0] || "Test";
      const last = nameParts.slice(1).join(" ") || "User";

      const payload = {
        data: {
          type: "individualCustomer",
          attributes: {
            fullName: {
              first,
              last,
            },
            email: input.email,
            phone: input.phone ? { countryCode: "1", number: input.phone.replace(/\D/g, "") } : { countryCode: "1", number: "5551234567" },
            address: input.address || {
              street: "123 Broadway",
              city: "New York",
              state: "NY",
              postalCode: "10001",
              country: "US",
            },
            dateOfBirth: input.dateOfBirth || "1990-01-01",
            ssn: input.ssn || "123456789",
          },
        },
      };

      const res = await this.client.post("/customers", payload);
      const data: any = res.data;

      return {
        customerId: data.id,
        provider: "unit",
        status: data.attributes.status || "Active",
        isMock: false,
      };
    } catch (err: any) {
      console.warn("[UnitCustomers] Live customer creation failed, using sandbox fallback:", err.message);
      return this.mockCreateCustomer(input);
    }
  }

  public async getCustomer(customerId: string): Promise<any> {
    if (this.client.isMockMode() || mockCustomers.has(customerId)) {
      return mockCustomers.get(customerId) || {
        id: customerId,
        type: "individualCustomer",
        attributes: { status: "Active", fullName: { first: "Maurice", last: "Lewis Jr" } }
      };
    }

    const res = await this.client.get(`/customers/${customerId}`);
    return res.data;
  }

  private mockCreateCustomer(input: CreateCustomerInput): CustomerResult {
    const customerId = `cust_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const mockRecord = {
      id: customerId,
      type: "individualCustomer",
      attributes: {
        fullName: input.fullName,
        email: input.email,
        status: "Active",
        createdAt: new Date().toISOString(),
      },
    };
    mockCustomers.set(customerId, mockRecord);

    return {
      customerId,
      provider: "unit",
      status: "Active",
      isMock: true,
    };
  }
}

export const unitCustomers = new UnitCustomers();
