<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RoleOrPermissionMiddleware
{
    /**
     * Handle an incoming request.
     * Format: role:Admin|permission:edit-users
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $roleOrPermission): Response
    {
        if (!Auth::check()) {
            return redirect()->route('login')->with('error', 'Please login to continue.');
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Super Admin has access to everything
        if ($user && $user->hasRole('Super Admin')) {
            return $next($request);
        }

        // Parse the role or permission
        $parts = explode('|', $roleOrPermission);

        foreach ($parts as $part) {
            if (str_starts_with($part, 'role:')) {
                $role = substr($part, 5);
                if ($user && $user->hasRole($role)) {
                    return $next($request);
                }
            } elseif (str_starts_with($part, 'permission:')) {
                $permission = substr($part, 11);
                if ($user && $user->hasPermissionTo($permission)) {
                    return $next($request);
                }
            }
        }

        abort(403, 'Unauthorized access. You do not have the required role or permission.');
    }
}
