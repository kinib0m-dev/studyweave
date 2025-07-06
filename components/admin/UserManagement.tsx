"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminUsers } from "@/lib/admin/hooks/useAdminUsers";
import { formatNumber } from "@/lib/admin/utils/stats";
import {
  Search,
  MoreHorizontal,
  Ban,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function UserManagement() {
  const {
    users,
    totalCount,
    currentPage,
    totalPages,
    isLoading,
    filters,
    updateFilters,
    updateUserStatus,
    suspendUser,
  } = useAdminUsers();

  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: "suspend" | "activate" | "delete" | null;
    user: any;
  }>({ open: false, type: null, user: null });

  const handleSearch = (value: string) => {
    updateFilters({ search: value, page: 1 });
  };

  const handleStatusFilter = (status: string) => {
    updateFilters({
      status: status === "all" ? undefined : (status as any),
      page: 1,
    });
  };

  const handleEmailStatusFilter = (emailStatus: string) => {
    updateFilters({
      emailStatus: emailStatus === "all" ? undefined : (emailStatus as any),
      page: 1,
    });
  };

  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  const handleUserAction = async (
    action: "suspend" | "activate" | "delete",
    user: any
  ) => {
    try {
      if (action === "suspend") {
        await suspendUser.mutateAsync({ userId: user.id });
        toast.success("User suspended successfully");
      } else if (action === "activate") {
        await updateUserStatus.mutateAsync({
          userId: user.id,
          status: "active",
        });
        toast.success("User activated successfully");
      } else if (action === "delete") {
        await updateUserStatus.mutateAsync({
          userId: user.id,
          status: "deleted",
        });
        toast.success("User deleted successfully");
      }
      setActionDialog({ open: false, type: null, user: null });
    } catch {
      toast.error("Failed to perform action");
    }
  };

  const formatDate = (date: Date | null) => {
    return date ? new Date(date).toLocaleDateString() : "Never";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by email or name..."
                value={filters.search || ""}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select onValueChange={handleStatusFilter} defaultValue="all">
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Account Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={handleEmailStatusFilter} defaultValue="all">
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Email Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Email Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead>Email Status</TableHead>
                  <TableHead>2FA</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7} className="text-center py-4">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.image || ""} />
                            <AvatarFallback>
                              {user.name?.charAt(0) ||
                                user.email?.charAt(0) ||
                                "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {user.name || "No name"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.accountStatus === "active"
                              ? "default"
                              : user.accountStatus === "suspended"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {user.accountStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.emailStatus === "confirmed"
                              ? "default"
                              : user.emailStatus === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {user.emailStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.isTwoFactorEnabled ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.lastLogin)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {user.accountStatus === "active" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setActionDialog({
                                    open: true,
                                    type: "suspend",
                                    user,
                                  })
                                }
                                className="text-red-600"
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Suspend User
                              </DropdownMenuItem>
                            )}
                            {user.accountStatus === "suspended" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setActionDialog({
                                    open: true,
                                    type: "activate",
                                    user,
                                  })
                                }
                                className="text-green-600"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activate User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() =>
                                setActionDialog({
                                  open: true,
                                  type: "delete",
                                  user,
                                })
                              }
                              className="text-red-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * filters.limit + 1} to{" "}
                {Math.min(currentPage * filters.limit, totalCount)} of{" "}
                {formatNumber(totalCount)} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "suspend" && "Suspend User"}
              {actionDialog.type === "activate" && "Activate User"}
              {actionDialog.type === "delete" && "Delete User"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "suspend" &&
                `Are you sure you want to suspend ${actionDialog.user?.email}? They will not be able to log in.`}
              {actionDialog.type === "activate" &&
                `Are you sure you want to activate ${actionDialog.user?.email}? They will be able to log in again.`}
              {actionDialog.type === "delete" &&
                `Are you sure you want to delete ${actionDialog.user?.email}? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setActionDialog({ open: false, type: null, user: null })
              }
            >
              Cancel
            </Button>
            <Button
              variant={
                actionDialog.type === "activate" ? "default" : "destructive"
              }
              onClick={() =>
                handleUserAction(actionDialog.type!, actionDialog.user)
              }
              disabled={updateUserStatus.isPending || suspendUser.isPending}
            >
              {actionDialog.type === "suspend" && "Suspend"}
              {actionDialog.type === "activate" && "Activate"}
              {actionDialog.type === "delete" && "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
