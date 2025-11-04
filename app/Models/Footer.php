<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Footer extends Model
{
    use HasFactory;

    protected $fillable = ['footer_logo', 'address', 'email', 'contact_number', 'website', 'terms_title', 'terms_link', 'privacy_title', 'privacy_link', 'rights_reserves_text'];

    public function footerSectionTwo()
    {
        return $this->hasMany(FooterSectionTwo::class);
    }

    public function footerSectionThree()
    {
        return $this->hasMany(FooterSectionThree::class);
    }

    public function footerSectionFour()
    {
        return $this->hasOne(FooterSectionFour::class);
    }
}
