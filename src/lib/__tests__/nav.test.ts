import { currentEntry, hrefOf, NAV_IDS, USER_NAV } from "@/lib/nav";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";

describe("the navigation is data — the web console's five destinations", () => {
  it("has the five entries of the web, in the order of the journey, under the web's addresses", () => {
    expect(USER_NAV.map((e) => e.id)).toEqual(["dashboard", "talk", "photos", "batch", "myIntros"]);
    expect(USER_NAV.map((e) => e.href)).toEqual(["", "/talk", "/photos", "/batch", "/intros"]);
    expect(USER_NAV).toHaveLength(NAV_IDS.length);
  });
  it("holds at most five top-level entries and never a settings tab (the account is a utility)", () => {
    expect(USER_NAV.length).toBeLessThanOrEqual(5);
    expect(USER_NAV.map((e) => e.id)).not.toContain("account");
  });
  it("words every entry in both languages", () => {
    for (const e of USER_NAV) {
      expect((en.tabs as Record<string, string>)[e.id]).toBeTruthy();
      expect((fr.tabs as Record<string, string>)[e.id]).toBeTruthy();
    }
  });
  it("finds the entry a path belongs to — a thread belongs to Introductions", () => {
    expect(currentEntry("/app/en").id).toBe("dashboard");
    expect(currentEntry("/app/fr/talk").id).toBe("talk");
    expect(currentEntry("/app/fr/photos").id).toBe("photos");
    expect(currentEntry("/app/en/batch").id).toBe("batch");
    expect(currentEntry("/app/en/intros").id).toBe("myIntros");
    expect(currentEntry("/app/en/intros/3f2a").id).toBe("myIntros");
  });
  it("builds the address under /app/<locale>", () => {
    expect(hrefOf("fr", USER_NAV[2])).toBe("/app/fr/photos");
    expect(hrefOf("en", USER_NAV[0])).toBe("/app/en");
  });
});
