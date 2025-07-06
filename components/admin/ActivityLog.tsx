"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { trpc } from "@/trpc/client";
import { formatNumber } from "@/lib/admin/utils/stats";
import { Search, CheckCircle, XCircle, Monitor } from "lucide-react";

export function ActivityLog() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    search: "",
    success: undefined as boolean | undefined,
  });

  const {
    data: activityData,
    isLoading,
    error,
  } = trpc.admin.getActivityLog.useQuery(filters);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleSuccessFilter = (success: string) => {
    setFilters((prev) => ({
      ...prev,
      success: success === "all" ? undefined : success === "true",
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const formatUserAgent = (userAgent: string | null) => {
    if (!userAgent) return "Unknown";

    // Extract browser name from user agent
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Other";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Login Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by email, name, or IP address..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select onValueChange={handleSuccessFilter} defaultValue="all">
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Login Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Attempts</SelectItem>
                <SelectItem value="true">Successful</SelectItem>
                <SelectItem value="false">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Activity Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="text-center py-4">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-4 text-red-600"
                    >
                      Error loading activity log
                    </TableCell>
                  </TableRow>
                ) : !activityData?.activities ||
                  activityData.activities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No activity found
                    </TableCell>
                  </TableRow>
                ) : (
                  activityData.activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {activity.userName || "Unknown User"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {activity.userEmail || "No email"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {activity.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <Badge
                            variant={
                              activity.success ? "success" : "destructive"
                            }
                          >
                            {activity.success ? "Success" : "Failed"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {activity.ipAddress}
                      </TableCell>
                      <TableCell>
                        {formatUserAgent(activity.userAgent)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(activity.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {activityData && activityData.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(activityData.currentPage - 1) * filters.limit + 1} to{" "}
                {Math.min(
                  activityData.currentPage * filters.limit,
                  activityData.totalCount
                )}{" "}
                of {formatNumber(activityData.totalCount)} activities
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(activityData.currentPage - 1)}
                  disabled={activityData.currentPage <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm px-2">
                  Page {activityData.currentPage} of {activityData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(activityData.currentPage + 1)}
                  disabled={activityData.currentPage >= activityData.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
