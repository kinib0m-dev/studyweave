"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminStats } from "@/lib/admin/hooks/useAdminStats";
import { formatNumber, formatPercentage } from "@/lib/admin/utils/stats";
import {
  Users,
  UserCheck,
  UserPlus,
  UserX,
  Activity,
  ShieldCheck,
} from "lucide-react";

export function AdminStats() {
  const { stats, isLoading, error } = useAdminStats();

  if (isLoading) {
    return <div>Loading stats...</div>;
  }

  if (error) {
    return <div>Error loading stats: {error.message}</div>;
  }

  if (!stats) {
    return <div>No stats available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(stats.totalUsers)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats.newUsers)} new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(stats.activeUsers)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage((stats.activeUsers / stats.totalUsers) * 100)}{" "}
              of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(stats.newUsers)}
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Suspended Users
            </CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(stats.suspendedUsers)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(
                (stats.suspendedUsers / stats.totalUsers) * 100
              )}{" "}
              of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Login Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm">Total Logins (7 days)</span>
              <span className="font-medium">
                {formatNumber(stats.totalLogins)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Failed Logins</span>
              <span className="font-medium">
                {formatNumber(stats.failedLogins)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Success Rate</span>
              <Badge
                variant={stats.successRate > 90 ? "default" : "destructive"}
              >
                {formatPercentage(stats.successRate)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              User Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {Object.entries(stats.usersByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{status}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatNumber(count)}</span>
                    <Badge
                      variant={
                        status === "active"
                          ? "default"
                          : status === "suspended"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {formatPercentage((count / stats.totalUsers) * 100)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Email Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {Object.entries(stats.usersByEmailStatus).map(
                ([status, count]) => (
                  <div
                    key={status}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm capitalize">{status}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatNumber(count)}</span>
                      <Badge
                        variant={
                          status === "confirmed"
                            ? "default"
                            : status === "pending"
                              ? "secondary"
                              : "destructive"
                        }
                        className="text-xs"
                      >
                        {formatPercentage((count / stats.totalUsers) * 100)}
                      </Badge>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
