<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The barista role is retired: the order flow now completes at the cashier.
     * Existing barista accounts become cashiers so nobody is locked out.
     */
    public function up(): void
    {
        DB::table('users')->where('role', 'barista')->update(['role' => 'kasir']);

        $this->setRoleColumn(['owner', 'kasir']);
    }

    public function down(): void
    {
        $this->setRoleColumn(['owner', 'kasir', 'barista']);
    }

    /**
     * Narrow (or widen) the role column.
     *
     * MySQL needs a raw MODIFY to redefine an ENUM; every other driver — SQLite
     * in the test suite included — goes through the schema builder, which
     * rebuilds the column for us.
     *
     * @param  array<int, string>  $roles
     */
    private function setRoleColumn(array $roles): void
    {
        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            $values = implode(',', array_map(fn (string $role) => "'{$role}'", $roles));

            DB::statement("ALTER TABLE `users` MODIFY `role` ENUM({$values}) NOT NULL DEFAULT 'kasir'");

            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('kasir')->change();
        });
    }
};
