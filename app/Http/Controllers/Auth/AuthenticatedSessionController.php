<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // Get the intended URL from request or use referer
        $intendedUrl = $request->input('intended_url') ?? $request->headers->get('referer');

        // Clean the URL and check if it's valid
        if ($intendedUrl) {
            // Parse the URL to check if it's not login/register/dashboard
            $path = parse_url($intendedUrl, PHP_URL_PATH);
            $excludedPaths = ['/login', '/register', '/dashboard', '/admin/dashboard', '/guest/dashboard'];

            $shouldRedirectToIntended = true;
            foreach ($excludedPaths as $excludedPath) {
                if (str_contains($path, $excludedPath)) {
                    $shouldRedirectToIntended = false;
                    break;
                }
            }

            if ($shouldRedirectToIntended) {
                return redirect($intendedUrl)->with('success', 'Welcome back!');
            }
        }

        // Otherwise use Laravel's intended redirect or dashboard
        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
