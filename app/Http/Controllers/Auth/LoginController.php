<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Illuminate\Http\JsonResponse;
use Inertia\Response;

class LoginController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('auth/login');
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $credentials = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $this->ensureIsNotRateLimited($request);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey($request));

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey($request));

        $request->session()->regenerate();

        // Return JSON response for AJAX requests (modal)
        if ($request->expectsJson()) {
            $user = Auth::user();

            return response()->json([
                'success' => true,
                'message' => 'Login successful.',
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => method_exists($user, 'getRoleNames') ? $user->getRoleNames() : []
                ],
                'redirect' => $this->getRedirectRoute($user)
            ]);
        }

        // Redirect based on user role for regular form submissions
        return redirect()->intended($this->getRedirectRoute(Auth::user()));
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

    /**
     * Ensure the login request is not rate limited.
     */
    protected function ensureIsNotRateLimited(Request $request): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey($request), 5)) {
            return;
        }

        event(new Lockout($request));

        $seconds = RateLimiter::availableIn($this->throttleKey($request));

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    protected function throttleKey(Request $request): string
    {
        return Str::transliterate(Str::lower($request->input('email')).'|'.$request->ip());
    }

    /**
     * Get the redirect route based on user role.
     */
    protected function getRedirectRoute($user): string
    {
        // Check if user has Spatie roles
        if (method_exists($user, 'hasRole')) {
            // Super Admin, Admin, and Partner go to admin dashboard
            if ($user->hasRole(['Super Admin', 'Admin', 'Partner'])) {
                return route('admin.dashboard');
            }

            // Guest or User role goes to guest dashboard
            if ($user->hasRole(['Guest', 'User'])) {
                return route('guest.dashboard');
            }
        }

        // Check role column if Spatie roles not working
        if (isset($user->role)) {
            if (in_array($user->role, ['Super Admin', 'Admin', 'Partner'])) {
                return route('admin.dashboard');
            }

            if (in_array($user->role, ['Guest', 'User'])) {
                return route('guest.dashboard');
            }
        }        // Default fallback to home
        return route('home');
    }
}
