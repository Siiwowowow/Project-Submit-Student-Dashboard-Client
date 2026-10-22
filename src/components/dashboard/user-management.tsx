"use client";

import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Search, LoaderCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUsers, updateUser, deleteUser } from "@/services/admin-user.services";
import { ApiError } from "@/services/project.services";
import { formatDate, roleLabel } from "@/lib/dashboard-utils";
import type { ManagedUser, SessionUser, UserAdminInput } from "@/types/project.types";
import { LoadingState, ErrorState } from "./feedback-state";

export function UserManagement({ user }: { user: SessionUser }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ user: ManagedUser; mode: "edit" | "delete" } | null>(null);
  const query = useQuery({ queryKey: ["users", page, search], queryFn: () => getUsers(page, search) });
  const totalPages = query.data?.pagination.totalPages || 1;
  return <div className="page-enter">
    <div className="page-heading"><div><span className="section-kicker">ADMIN CONTROLS</span><h1>Manage users</h1><p>Edit student and mentor accounts, manage access, and keep the workspace organized.</p></div></div>
    <section className="projects-panel user-management-panel">
      <div className="panel-heading"><div><h2><Users size={19} />Workspace accounts <span className="count-pill">{query.data?.pagination.total ?? "..."}</span></h2><p>Deleting an account disables access and preserves its project history.</p></div></div>
      <form className="user-search" onSubmit={event => { event.preventDefault(); setSearch(String(new FormData(event.currentTarget).get("search") || "").trim()); setPage(1); }}><label className="sr-only" htmlFor="user-search">Search users</label><Input id="user-search" name="search" placeholder="Search by name or email" maxLength={100} /><Button type="submit" variant="outline"><Search size={15} />Search</Button></form>
      {query.isPending ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : <>
        <Table className="user-table" aria-label="Workspace accounts"><TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Joined</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {query.data.users.map(account => <TableRow key={account.id}><TableCell><strong>{account.name || "Unnamed user"}</strong><small className="user-email">{account.email}</small></TableCell><TableCell>{roleLabel(account.role)}</TableCell><TableCell><span className={"account-status " + (account.status === "ACTIVE" ? "account-active" : "account-blocked")}>{account.status === "ACTIVE" ? "Active" : "Blocked"}</span></TableCell><TableCell>{formatDate(account.createdAt)}</TableCell><TableCell><div className="row-actions"><button className="row-action" aria-label={"Edit user " + account.email} title="Edit user" onClick={() => setSelected({ user: account, mode: "edit" })}><Pencil size={15} /></button><button className="row-action action-reject" aria-label={"Delete user " + account.email} disabled={account.id === user.id} title={account.id === user.id ? "You cannot delete your own account" : "Delete user"} onClick={() => setSelected({ user: account, mode: "delete" })}><Trash2 size={15} /></button></div></TableCell></TableRow>)}
        </TableBody></Table>
        {!query.data.users.length && <p className="management-notice">No accounts match your search.</p>}
      </>}
      <div className="pagination-bar"><span className="pagination-summary">Page {page} of {totalPages}</span><div className="pagination-controls"><Button variant="outline" disabled={page <= 1 || query.isPending} onClick={() => setPage(page - 1)}>Previous</Button><Button variant="outline" disabled={page >= totalPages || query.isPending} onClick={() => setPage(page + 1)}>Next</Button></div></div>
    </section>
    {selected && <UserDialog key={selected.user.id + selected.mode} target={selected.user} currentUser={user} mode={selected.mode} onClose={() => setSelected(null)} onSaved={() => setPage(1)} />}
  </div>;
}

function UserDialog({ target, currentUser, mode, onClose, onSaved }: {
  target: ManagedUser; currentUser: SessionUser; mode: "edit" | "delete"; onClose: () => void; onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const self = currentUser.id === target.id;
  const mutation = useMutation({
    mutationFn: async (input?: UserAdminInput) => mode === "delete" ? deleteUser(target.id) : updateUser(target.id, input!),
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["users"] }), queryClient.invalidateQueries({ queryKey: ["projects"] })]);
      toast.success(mode === "delete" ? "User access removed." : "User updated."); onClose(); onSaved();
    },
    onError: failure => setError(failure instanceof ApiError && Object.keys(failure.fields).length ? Object.values(failure.fields).join(" ") : failure.message),
  });
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    mutation.mutate({ name: String(form.get("name")), email: String(form.get("email")), role: (form.get("role") || target.role) as UserAdminInput["role"], status: (form.get("status") || target.status) as UserAdminInput["status"], ...(password ? { password } : {}) });
  }
  return <Dialog open onOpenChange={open => { if (!open && !mutation.isPending) onClose(); }}><DialogContent className="management-dialog" showCloseButton={!mutation.isPending}>
    <DialogHeader><DialogTitle>{mode === "delete" ? "Delete user" : "Edit user"}</DialogTitle><DialogDescription>{target.email}</DialogDescription></DialogHeader>
    {mode === "delete" ? <><p className="management-notice">This account will no longer be able to sign in. Existing project submissions and review history will be kept.</p>{error && <p className="field-error" role="alert">{error}</p>}<div className="management-actions"><Button variant="outline" disabled={mutation.isPending} onClick={onClose}>Cancel</Button><Button className="danger-button" disabled={mutation.isPending} onClick={() => mutation.mutate(undefined)}>{mutation.isPending && <LoaderCircle className="animate-spin" size={16} />}Delete account</Button></div></> :
      <form className="management-form" onSubmit={save}><fieldset disabled={mutation.isPending}>
        <div className="form-field"><label htmlFor="edit-user-name">Name</label><Input id="edit-user-name" name="name" defaultValue={target.name || ""} minLength={2} maxLength={100} required /></div>
        <div className="form-field"><label htmlFor="edit-user-email">Email address</label><Input id="edit-user-email" name="email" type="email" defaultValue={target.email} maxLength={254} required /></div>
        <div className="form-field"><label htmlFor="edit-user-role">Account role</label><select className="management-select" id="edit-user-role" name="role" defaultValue={target.role} disabled={self}><option value="STUDENT">Student</option>{target.role === "USER" && <option value="USER">Student (legacy)</option>}<option value="MENTOR">Mentor</option><option value="ADMIN">Admin</option><option value="SUPER_ADMIN">Super Admin</option></select></div>
        <div className="form-field"><label htmlFor="edit-user-status">Account status</label><select className="management-select" id="edit-user-status" name="status" defaultValue={target.status} disabled={self}><option value="ACTIVE">Active</option><option value="BLOCKED">Blocked</option></select></div>
        <div className="form-field"><label htmlFor="edit-user-password">New password (optional)</label><Input id="edit-user-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} /><p className="form-helper">Leave blank to keep the current password. At least 8 characters for a new password.</p></div>
      </fieldset>{error && <p className="field-error" role="alert">{error}</p>}<div className="management-actions"><Button variant="outline" type="button" disabled={mutation.isPending} onClick={onClose}>Cancel</Button><Button className="primary-button" type="submit" disabled={mutation.isPending}>{mutation.isPending && <LoaderCircle className="animate-spin" size={16} />}Save user</Button></div></form>}
  </DialogContent></Dialog>;
}
