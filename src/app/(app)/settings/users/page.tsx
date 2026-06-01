import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InviteForm } from "./invite-form";
import { UserRow } from "./user-row";

export default async function UsersPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: users }, { data: vendors }] = await Promise.all([
    supabase.from("users").select("*").order("created_at", { ascending: true }),
    supabase.from("vendors").select("id, name").order("name"),
  ]);

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage staff and vendor access. Invites are sent by email."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Invite a user</CardTitle>
        </CardHeader>
        <CardContent>
          <InviteForm vendors={vendors ?? []} />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm">All users ({users?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role &amp; access</TableHead>
                <TableHead />
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users ?? []).map((u) => (
                <UserRow key={u.id} user={u} vendors={vendors ?? []} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
